#include <iostream>
#include <string>

namespace {

std::string escape_json(const std::string& input) {
  std::string out;
  out.reserve(input.size());
  for (char ch : input) {
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

std::string extract_id(const std::string& line) {
  const std::string needle = "\"id\":\"";
  const auto start = line.find(needle);
  if (start == std::string::npos) return "unknown";
  const auto begin = start + needle.size();
  const auto end = line.find('"', begin);
  if (end == std::string::npos) return "unknown";
  return line.substr(begin, end - begin);
}

}  // namespace

int main() {
  std::ios::sync_with_stdio(false);
  std::string line;
  while (std::getline(std::cin, line)) {
    const auto id = extract_id(line);
    std::cout
      << "{\"id\":\"" << escape_json(id)
      << "\",\"type\":\"response\",\"ok\":true,\"result\":{\"mode\":\"cpp-daemon-skeleton\"}}"
      << '\n';
    std::cout.flush();
  }
  return 0;
}
