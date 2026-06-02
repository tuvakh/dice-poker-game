// Reusable page banner shown at the top of pages like Home and About
// heroImg is the background image, title is the big heading
// children is a special React prop. It renders whatever JSX the parent puts between the opening and closing <Hero> tags
export default function Hero({ title, children, heroImg }) {
    return (
        // Background image is set inline so each page can pass its own image
        <section className="hero img-overlay" style={{ backgroundImage: `url(${heroImg})` }}>
            <h1>{title}</h1>
            {children}
        </section>
    );
}
