import Link from 'next/link';
import React from 'react'

const Homepage = () => {
  return (
    <div>
      <h1>Welcome to munchspace admin</h1>
      <p>Pages</p>
      <div className="flex flex-col text-blue-500 underline">
        <Link href={"/sign-in"}>Login</Link>
        <Link href={"/reset-password"}>Reset Password</Link>
        <Link href={"/change-password"}>Change Password</Link>
        <Link href={"/admin/settings"}>Settings</Link>
        <Link href={"/admin/orders"}>Orders</Link>
        <Link href={"/admin/vendors"}>Vendors</Link>
        <Link href={"/admin/customers"}>Customers</Link>
        <Link href={"/admin/dashboard"}>Dashboard</Link>
      </div>
    </div>
  );
}

export default Homepage