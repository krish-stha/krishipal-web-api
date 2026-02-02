import UserProfilePanel from "./UserProfilePanel";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500">
              ACCOUNT
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Update your account details and profile photo.
            </p>
          </div>

          <div className="px-6 py-6">
            <UserProfilePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
