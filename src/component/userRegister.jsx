// import React, { useState } from "react";
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// function UserRegister() {
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//     gender: "",
//     email: "",
//   });
//   const [userData,setuseData]=useState("")

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     console.log("submitting", formData);
//     try{
//     const data = await fetch("http://localhost:8000/api/userRegister", {
//       method: "POST", // set the HTTP verb
//       credentials: "include", // send cookies
//       headers: {
//         "Content-Type": "application/json", // correct header object
//       },
//       body: JSON.stringify(formData), // your payload
//     });
//     const result=await data.json()
//     setuseData(result.message)
//     toast.success(result.message);
//   }catch(err){
//     toast.error(userData)
//   }

//   };

//   const handleInputChange = (event) => {
//     const { name, value } = event.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   return (
//     <div className="w-full max-w-md mx-auto">
//       <form onSubmit={handleFormSubmit} className="space-y-6 pt-10 md:pt-20">
//         {/* Username */}
//         <div className="flex flex-col md:flex-row md:items-center md:gap-5">
//           <label htmlFor="username" className="w-24  font-semibold">
//             Username
//           </label>
//           <input
//             id="username"
//             name="username" // ← add this
//             type="text"
//             placeholder="Enter username"
//             className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
//             value={formData.username}
//             onChange={handleInputChange}
//           />
//         </div>

//         {/* Email */}
//         <div className="flex flex-col md:flex-row md:items-center md:gap-5">
//           <label htmlFor="email" className="w-24  font-semibold">
//             Email
//           </label>
//           <input
//             id="email"
//             name="email" // ← add this
//             type="email"
//             placeholder="Enter email"
//             className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
//             value={formData.email}
//             onChange={handleInputChange}
//           />
//         </div>

//         {/* Password */}
//         <div className="flex flex-col md:flex-row md:items-center md:gap-5">
//           <label htmlFor="password" className="w-24  font-semibold">
//             Password
//           </label>
//           <input
//             id="password"
//             name="password" // ← add this
//             type="password"
//             placeholder="Enter password"
//             className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
//             value={formData.password}
//             onChange={handleInputChange}
//           />
//         </div>

//         {/* Gender */}
//         <div className="flex flex-col md:flex-row md:items-center md:gap-5">
//           <span className="w-24  font-semibold">Gender</span>
//           <div className="flex gap-6 pt-2 md:pt-0">
//             <label className="inline-flex items-center gap-2 cursor-pointer">
//               <input
//                 type="radio"
//                 name="gender"
//                 value="Male" // ← hard‑coded value
//                 checked={formData.gender === "Male"}
//                 onChange={handleInputChange}
//                 className="accent-teal-600"
//               />
//               Male
//             </label>
//             <label className="inline-flex items-center gap-2 cursor-pointer">
//               <input
//                 type="radio"
//                 name="gender"
//                 value="Female" // ← hard‑coded value
//                 checked={formData.gender === "Female"}
//                 onChange={handleInputChange}
//                 className="accent-teal-600"
//               />
//               Female
//             </label>
//           </div>
//         </div>

//         <button
//           type="submit"
//           className="px-4 py-2 bg-teal-600 text-white rounded"
//         >
//           Register
//         </button>
//       </form>
//             <ToastContainer 
//         position="top-right"     // optional: top-left, bottom-center, etc.
//         autoClose={5000}         // auto-dismiss in milliseconds
//         hideProgressBar={false}  // show/hide progress bar
//         newestOnTop={false}      // stack order
//         closeOnClick             // dismiss on click
//         pauseOnHover             // pause timeout on hover
//         draggable                // allow drag to dismiss
//       />

//     </div>
//   );
// }

// export default UserRegister;
"use client"
import { useState } from "react"
import { toast } from "react-toastify"

export default function UserRegister({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    gender: "",
    email: "",
  })

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    console.log("submitting", formData)

    try {
      const response = await fetch("http://localhost:8000/api/userRegister", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        onRegisterSuccess() // Switch to login form after successful registration
      } else {
        toast.error(result.message || "Registration failed")
      }
    } catch (err) {
      toast.error("An error occurred during registration")
      console.error(err)
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
      <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
        {/* Username */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-5">
          <label htmlFor="username" className="w-24 font-semibold">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter username"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-5">
          <label htmlFor="email" className="w-24 font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter email"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-5">
          <label htmlFor="password" className="w-24 font-semibold">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-5">
          <span className="w-24 font-semibold">Gender</span>
          <div className="flex gap-6 pt-2 md:pt-0">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === "Male"}
                onChange={handleInputChange}
                className="accent-teal-600"
                required
              />
              Male
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === "Female"}
                onChange={handleInputChange}
                className="accent-teal-600"
              />
              Female
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
        >
          Register
        </button>
      </form>
    </div>
  )
}

