export function getDashboardPath(role) {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/hotel-admin";
  return "/user-portal";
}

export function getFirstName(user) {
  if (!user) return "Guest";
  const name = user.name || user.fullName || "";
  if (name.trim()) {
    const first = name.trim().split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  if (user.email) {
    const prefix = user.email.split("@")[0].replace(/[._-].*$/, "");
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return "Guest";
}
