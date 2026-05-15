// Reusable page banner shown at the top of pages like Home and About
// heroImg is the background image, title is the big heading, and children is anything extra (e.g. a button)
export default function Hero({ title, children, heroImg }) {
    return (
        // The background image is set inline so each page can pass its own image
        <section className="hero img-overlay" style={{ backgroundImage: `url(${heroImg})` }}>
            <h1>{title}</h1>
            {children}
        </section>
    );
}