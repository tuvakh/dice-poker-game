// Lets the user choose how many seconds each round lasts (3, 10, or 30)
// onChange is passed in from the parent (CreateGame) and updates the game settings there
export default function TimeControlSelector({ onChange }) {
    return (
        <label>
            Time per round
            {/* parseInt converts the string from the select to a number before sending it up */}
            <select onChange={event => onChange("timeController", parseInt(event.target.value))}>
                <option value={3}>3 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
            </select>
        </label>
    );
}
