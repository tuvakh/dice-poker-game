export default function Hero({ title, children, heroImg }) {
    return (
        <section className="hero img-overlay" style={{ backgroundImage: `url(${heroImg})` }}>
            <h1>{title}</h1>
            {children}
        </section>
    );
}
