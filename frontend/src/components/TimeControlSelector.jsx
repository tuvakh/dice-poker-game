export default function TimeControlSelector({ onChange }) {
    return (
        <label>
            Total time across all rounds
            <select onChange={event => onChange("timeController", parseInt(event.target.value))}>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={90}>90 seconds</option>
            </select>
        </label>
    );
}
