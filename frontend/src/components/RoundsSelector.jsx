export default function RoundsSelector({ onChange }) {
    return (
        <label>
            Rounds
            <select onChange={event => onChange("numberOfRounds", parseInt(event.target.value))}>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
                <option value={7}>Best of 7</option>
            </select>
        </label>
    );
}
