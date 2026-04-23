import { useState, useEffect, useRef } from "react";
import Navbar from "../Components/NavBar";
import "../styles/Global.css";
import POCard from "../Components/Cards";

export default function Marketplace() {
    return (
        <>
            <Navbar />
            <div style={{ padding: "20px" }}>
                <h1>Marketplace</h1>
            </div>
            <div className="Search" style={{ fontFamily: "'Sora', sans-serif", alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", padding: "20px 20px", gap: "50px"}}>
                <h1>Find the Right Supplier, Faster</h1>
                <p>Connect with verified suppliers, compare quotes, and discover new products all in one place.</p>
                
                <input type="text" placeholder="Search for products, suppliers, etc." style={{ width: "100%", padding: "10px", fontSize: "16px" }} />
            </div>
            <div style={{ padding: "20px", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", display: "grid" }}>
                <POCard />
                <POCard />
                <POCard />
                <POCard />
                <POCard />
                <POCard />
                <POCard />
                <POCard />
                <POCard />
            </div>
        </>
    );
}