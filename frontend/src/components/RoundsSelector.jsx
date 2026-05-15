// Lets the user pick how many rounds the game will have (best of 3, 5, or 7)
// onChange is passed in from the parent (CreateGame) and updates the game settings there
export default function RoundsSelector({ onChange }) {
    return (
        <label>
            Rounds
            {/* parseInt converts the string value from the select to a number before sending it up */}
            <select onChange={event => onChange("numberOfRounds", parseInt(event.target.value))}>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
                <option value={7}>Best of 7</option>
            </select>
        </label>
    );
}
