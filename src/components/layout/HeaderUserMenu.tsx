import { useNavigate } from 'react-router-dom';
import { getAuthSession } from '../../lib/authStorage';
import { formatUserRole } from '../../lib/formatUserRole';
import { UserMenu } from '../ui';

export default function HeaderUserMenu() {
  const navigate = useNavigate();
  const displayUser = getAuthSession()?.user;

  function handleSelect(value: string) {
    if (value === 'profile') {
      navigate('/profile');
    }
  }

  if (!displayUser) {
    return null;
  }

  return (
    <UserMenu
      name={displayUser.name}
      role={formatUserRole(displayUser.role)}
      onSelect={handleSelect}
    />
  );
}
