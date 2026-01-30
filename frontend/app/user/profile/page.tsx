import UserProfilePanel from "./UserProfilePanel";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-xl bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <UserProfilePanel />
      </div>
    </div>
  );
}
