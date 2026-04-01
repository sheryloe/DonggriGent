#include <chrono>
#include <cctype>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <string_view>
#include <utility>

namespace {

std::string trim(std::string_view input) {
  size_t begin = 0;
  while (begin < input.size() && std::isspace(static_cast<unsigned char>(input[begin]))) begin++;
  size_t end = input.size();
  while (end > begin && std::isspace(static_cast<unsigned char>(input[end - 1]))) end--;
  return std::string(input.substr(begin, end - begin));
}

std::string escape_json_string(std::string_view input) {
  std::string out;
  out.reserve(input.size());
  for (const unsigned char uch : input) {
    const char ch = static_cast<char>(uch);
    switch (ch) {
      case '\\': out += "\\\\"; break;
      case '"': out += "\\\""; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default: out += ch; break;
    }
  }
  return out;
}

std::string now_iso8601_utc() {
  const auto now = std::chrono::system_clock::now();
  const std::time_t tt = std::chrono::system_clock::to_time_t(now);
  std::tm tm{};
#if defined(_WIN32)
  gmtime_s(&tm, &tt);
#else
  gmtime_r(&tt, &tm);
#endif
  std::ostringstream oss;
  oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
  return oss.str();
}

void skip_ws(std::string_view s, size_t& i) {
  while (i < s.size() && std::isspace(static_cast<unsigned char>(s[i]))) i++;
}

// Minimal JSON scanner for this protocol (JSON.stringify output).
// Extracts string field values by looking for `"field":"..."`
bool extract_string_field(std::string_view json, std::string_view field, std::string& out) {
  const std::string needle = std::string("\"") + std::string(field) + "\":\"";
  const size_t start = json.find(needle);
  if (start == std::string_view::npos) return false;
  size_t i = start + needle.size();
  std::string value;
  value.reserve(32);
  while (i < json.size()) {
    const char ch = json[i++];
    if (ch == '"') break;
    if (ch == '\\' && i < json.size()) {
      const char esc = json[i++];
      switch (esc) {
        case '"': value.push_back('"'); break;
        case '\\': value.push_back('\\'); break;
        case 'n': value.push_back('\n'); break;
        case 'r': value.push_back('\r'); break;
        case 't': value.push_back('\t'); break;
        default: value.push_back(esc); break;
      }
      continue;
    }
    value.push_back(ch);
  }
  out = std::move(value);
  return true;
}

size_t find_matching_brace(std::string_view s, size_t open_pos) {
  if (open_pos >= s.size() || s[open_pos] != '{') return std::string_view::npos;
  size_t depth = 0;
  bool in_string = false;
  bool escape = false;
  for (size_t i = open_pos; i < s.size(); i++) {
    const char ch = s[i];
    if (in_string) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch == '\\') {
        escape = true;
        continue;
      }
      if (ch == '"') in_string = false;
      continue;
    }
    if (ch == '"') {
      in_string = true;
      continue;
    }
    if (ch == '{') depth++;
    if (ch == '}') {
      depth--;
      if (depth == 0) return i;
    }
  }
  return std::string_view::npos;
}

bool extract_object_slice(std::string_view json, std::string_view field, std::string_view& out_obj) {
  const std::string needle = std::string("\"") + std::string(field) + "\":";
  const size_t start = json.find(needle);
  if (start == std::string_view::npos) return false;
  size_t i = start + needle.size();
  skip_ws(json, i);
  if (i >= json.size() || json[i] != '{') return false;
  const size_t end = find_matching_brace(json, i);
  if (end == std::string_view::npos) return false;
  out_obj = json.substr(i, (end - i) + 1);
  return true;
}

std::string json_string(std::string_view value) {
  return std::string("\"") + escape_json_string(value) + "\"";
}

struct Session {
  std::string key;
  std::string vendor_id;
  std::string tab_id;  // empty => null
  std::string updated_at;
};

std::string session_to_json(const Session& s) {
  std::ostringstream oss;
  oss << "{"
      << "\"key\":" << json_string(s.key) << ","
      << "\"vendorId\":" << json_string(s.vendor_id) << ",";
  if (s.tab_id.empty()) {
    oss << "\"tabId\":null,";
  } else {
    oss << "\"tabId\":" << json_string(s.tab_id) << ",";
  }
  oss << "\"updatedAt\":" << json_string(s.updated_at)
      << "}";
  return oss.str();
}

std::string ok_envelope(std::string_view id, std::string_view result_json) {
  std::ostringstream oss;
  oss << "{"
      << "\"id\":" << json_string(id) << ","
      << "\"type\":\"response\","
      << "\"ok\":true,"
      << "\"result\":" << result_json
      << "}";
  return oss.str();
}

std::string error_envelope(std::string_view id, std::string_view code, std::string_view message) {
  std::ostringstream oss;
  oss << "{"
      << "\"id\":" << json_string(id) << ","
      << "\"type\":\"response\","
      << "\"ok\":false,"
      << "\"error\":{"
      << "\"code\":" << json_string(code) << ","
      << "\"message\":" << json_string(message)
      << "}"
      << "}";
  return oss.str();
}

}  // namespace

int main() {
  std::ios::sync_with_stdio(false);

  std::map<std::string, Session> sessions;

  std::string line;
  while (std::getline(std::cin, line)) {
    if (line.empty()) continue;

    std::string id;
    std::string name;
    std::string_view payload_obj;

    if (!extract_string_field(line, "id", id) || !extract_string_field(line, "name", name)) {
      // Best-effort: ignore malformed input.
      continue;
    }

    const bool has_payload = extract_object_slice(line, "payload", payload_obj);

    if (name == "session.ensure") {
      std::string key;
      std::string vendor_id;
      std::string tab_id;
      if (has_payload) {
        extract_string_field(payload_obj, "key", key);
        extract_string_field(payload_obj, "vendorId", vendor_id);
        extract_string_field(payload_obj, "tabId", tab_id);
      }
      key = trim(key);
      vendor_id = trim(vendor_id);
      tab_id = trim(tab_id);
      if (vendor_id.empty()) vendor_id = "chatgpt";

      Session session{
        .key = key,
        .vendor_id = vendor_id,
        .tab_id = tab_id,
        .updated_at = now_iso8601_utc()
      };
      if (!session.key.empty()) sessions[session.key] = session;

      std::ostringstream result;
      result << "{"
             << "\"session\":" << session_to_json(session)
             << "}";
      std::cout << ok_envelope(id, result.str()) << "\n";
      std::cout.flush();
      continue;
    }

    std::cout << error_envelope(id, "unsupported_core_command", "unsupported_core_command:" + name) << "\n";
    std::cout.flush();
  }

  return 0;
}
