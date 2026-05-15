// I created a rudimentary auth middleware
// It reads the X-User-Role header on every request to determine the access level for anonymous, regular and admin users.
// In a real app I should use JWT tokens. I explained this more in my documentation

// This function sets the user role on every request
// It defaults to "anonymous" if no header is provided
export function setUserRole(req, res, next) {
    const role = req.headers["x-user-role"];
    req.userRole = role || "anonymous";
    next();
}

// This function blocks anyone who is not an admin, with a 403 Forbidden response
export function requireAdmin(req, res, next) {
    if (req.userRole !== "admin") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Nice try, but you need to be an admin to do this" });
    }
    next();
}

// This function allows both "user" and "admin", since admins can do everything registered users can
// Gives a 403 Forbidden response if you're not logged in
export function requireUser(req, res, next) {
    if (req.userRole !== "user" && req.userRole !== "admin") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Who are you? You need to be logged in to do this" });
    }
    next();
}