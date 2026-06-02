// Lets the user choose whether straights are allowed in the game
// onChange comes from the parent (CreateGame) and updates the shared game settings state there
export default function GameRulesSelector({ onChange }) {
    return (
        <label>
            Rules
            <select onChange={event => onChange("gameRules", event.target.value)}>
                <option value="straights_allowed">Straights allowed</option>
                <option value="straights_not_allowed">No straights</option>
            </select>
        </label>
    );
}
