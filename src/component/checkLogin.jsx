"use client"
import { useState, useEffect } from "react"
import Login from "./login.jsx"
import UserRegister from "./userRegister.jsx"
import Chat from "./chat.jsx"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [showRegister, setShowRegister] = useState(false)

  // Remove the authentication check since there's no check-auth route
  useEffect(() => {
    // We'll rely solely on the login form to set authentication state
    // No initial auth check needed
  }, [])

  const handleLoginSuccess = (username) => {
    setUsername(username)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername("")
  }

  const toggleForm = () => {
    setShowRegister(!showRegister)
  }

  return (
    <div className="container mx-auto p-4">
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto">
          {showRegister ? (
            <>
              <UserRegister onRegisterSuccess={toggleForm} />
              <p className="text-center mt-4">
                Already have an account?{" "}
                <button onClick={toggleForm} className="text-teal-600 hover:underline">
                  Login
                </button>
              </p>
            </>
          ) : (
            <>
              <Login onLoginSuccess={handleLoginSuccess} />
              <p className="text-center mt-4">
                Don&apos;t have an account?{" "}
                <button onClick={toggleForm} className="text-teal-600 hover:underline">
                  Register
                </button>
              </p>
            </>
          )}
        </div>
      ) : (
        <Chat username={username} onLogout={handleLogout} />
      )}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  )
}
