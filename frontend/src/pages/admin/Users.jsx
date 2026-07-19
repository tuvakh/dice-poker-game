import { useState } from "react";
import { getUsers, banUser, unbanUser, changeRole } from "../../api/adminUsers.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import Spinner from "../../components/Spinner.jsx";
import Button from "../../components/Button.jsx";

export default function AdminUsers() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;
    const debouncedSearch = useDebouncedValue(search, 250);

    const { data, loading, error } = useFetch((signal) => getUsers({ page, limit, search: debouncedSearch }, signal), [page, debouncedSearch]);

    if (error) return <p className="status status--error">{error}</p>;

    return (
        <div>
            <header>
                <h1>User Administration</h1>
                <input style={{ marginBottom: 20, padding: 5 }} aria-label="Search username" placeholder="Search username" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
            </header>

            {loading && !data && <Spinner />}

            <table className="admin__users">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Banned</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {(data?.userList || []).map(userItem => (
                        <tr key={userItem.userId}>
                            <td>{userItem.username}</td>
                            <td>{userItem.email}</td>
                            <td>
                                <select style={{ paddingBlock: 8, paddingInline: 4, borderRadius: 8, border: "none" }} defaultValue={userItem.role} onChange={async (event) => {
                                    await changeRole(userItem.userId, event.target.value);
                                    window.location.reload();
                                }}>
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </td>
                            <td>{userItem.banned ? 'Yes' : 'No'}</td>
                            <td>
                                {userItem.banned ? (
                                    <Button variant="danger" onClick={async () => { await unbanUser(userItem.userId); window.location.reload(); }}>Unban</Button>
                                ) : (
                                    <Button variant="danger" onClick={async () => { await banUser(userItem.userId); window.location.reload(); }}>Ban</Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="pagination" style={{ marginTop: 12 }}>
                <Button disabled={!data || data.page === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>Prev</Button>
                <span style={{ margin: '0 8px' }}>Page {data?.page || 1} of {data?.totalPages || 1}</span>
                <Button disabled={!data || data.page === data.totalPages} onClick={() => setPage(prev => Math.min(data.totalPages || 1, prev + 1))}>Next</Button>
            </div>
        </div>
    );
}
