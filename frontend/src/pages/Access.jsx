import { useState } from 'react';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { ROLES, NAV } from '../utils/constants.js';
import api from '../utils/api.js';

export default function Access() {
  const { settings, reload } = useSettings();
  const toast = useToast();

  const screens = NAV.filter(n => n !== 'Access Control');
  const roles = ROLES.filter(r => r !== 'ADMIN');

  const getPerm = (role, screen) => {
    const perms = settings?.permissions?.[role];
    return perms?.[screen] === 1 || perms?.[screen] === true;
  };

  const setPerm = async (role, screen, value) => {
    await api.patch('/settings/permissions', { role, screen, value });
    toast(`${role} access updated`);
    reload();
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Access Control</h1>
          <p>Grant or restrict screen access by role. Admin always keeps full control.</p>
        </div>
      </div>

      <div className="panel" style={{ overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              {screens.map(s => <th key={s}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role}>
                <td><span className={`badge ${role}`}>{role}</span></td>
                {screens.map(screen => (
                  <td key={screen}>
                    <input
                      type="checkbox"
                      checked={getPerm(role, screen)}
                      onChange={e => setPerm(role, screen, e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
