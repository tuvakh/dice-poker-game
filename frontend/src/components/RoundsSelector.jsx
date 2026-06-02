// Lets the user pick how many rounds the game will have (3 / 5 / 7)
// onChange comes from the parent (CreateGame) and updates the shared game settings state there
export default function RoundsSelector({ onChange }) {
    return (
        <label>
            Rounds
            {/* select value is always a string, so parseInt converts it to a number before passing it up */}
            <select onChange={event => onChange("numberOfRounds", parseInt(event.target.value))}>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
                <option value={7}>Best of 7</option>
            </select>
        </label>
    );
}
