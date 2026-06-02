// Lets the user pick the total time budget for all rounds (10 / 30 / 90 seconds)
// onChange comes from the parent (CreateGame) and updates the shared game settings state there
export default function TimeControlSelector({ onChange }) {
    return (
        <label>
            Total time across all rounds
            {/* select value is always a string, so parseInt converts it to a number before passing it up */}
            <select onChange={event => onChange("timeController", parseInt(event.target.value))}>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={90}>90 seconds</option>
            </select>
        </label>
    );
}
