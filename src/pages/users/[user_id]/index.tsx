import { useParams } from 'react-router'

import UserProfileClient from './UserProfileClient'

export default function UserProfilePage() {
	const { user_id } = useParams<{ user_id: string }>()

	return <UserProfileClient userId={user_id || ''} />
}
