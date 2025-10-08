import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userQueries } from '@/queries/userQueries.ts';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { data: userData } = useQuery(userQueries.users.list);
  const { data: adminData } = useQuery(userQueries.users.adminUsers);

  const queryClient = useQueryClient();

  const invalidateData = async() => {
    console.log('invalidate')
    await queryClient.invalidateQueries({queryKey: userQueries.users.getQueryKey()})
  }

  return (
    <div className="text-center">
      <h2>User Data</h2>
      <ul>
        {userData?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <h2>Admin Data</h2>
      <ul>
        {adminData?.map((user) => (
          <li key={user.id}>{user.name} -  {user.timeStamp}</li>
        ))}
      </ul>
      <button onClick={invalidateData}>invalidate</button>
    </div>
  );
}
