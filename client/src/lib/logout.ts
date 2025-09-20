const SIDEBAR_STORAGE_KEY = "sidebarOpen";

export function handleLogout() {
  // Clear sidebar preference from localStorage on logout
  localStorage.removeItem(SIDEBAR_STORAGE_KEY);
  
  // Redirect to logout endpoint
  window.location.href = "/api/logout";
}