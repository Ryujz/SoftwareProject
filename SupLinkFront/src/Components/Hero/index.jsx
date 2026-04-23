export default function Hero() {
    return (
        <div className="hero-content">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-5xl font-bold text-center">Find the Right Supplier, Faster</h1>
                <p className="py-6">Connect with vetted suppliers worldwide. Post your requirements and get matched with the best suppliers.</p>
                <div className="flex flex-row items-center justify-center gap-3">
                    <input type="text" placeholder="Type here" className="input" />
                    <button className="btn btn-primary">Get Started</button>
                </div>
            </div>
        </div>
    
    )
}