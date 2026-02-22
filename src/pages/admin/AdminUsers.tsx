import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { PageTitle, Card, Btn, Badge, Spinner, Empty } from '@/components/shared/ui'

interface UserRow extends Profile {
  email?: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'admin' | 'student'>('all')
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  async function changeRole(userId: string, newRole: 'admin' | 'student') {
    if (!confirm(`Cambiare il ruolo di questo utente in "${newRole}"?`)) return
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) { alert('Errore: ' + error.message); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    flash('✅ Ruolo aggiornato!')
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Eliminare l'account di "${name}"? Questa azione è irreversibile e rimuoverà anche tutti i suoi invii.`)) return
    // Supabase cascade elimina il profilo e i dati collegati
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      // Fallback: elimina solo il profilo (richiede service_role, da fare lato server)
      alert('Per eliminare utenti è necessaria la service_role key. Usa il pannello Supabase → Authentication → Users.')
      return
    }
    setUsers(prev => prev.filter(u => u.id !== userId))
    flash('✅ Utente eliminato.')
  }

  function flash(msg: string) {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(''), 3000)
  }

  if (loading) return <Spinner />

  const filtered = users
    .filter(u => filter === 'all' || u.role === filter)
    .filter(u => !search || u.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageTitle>Gestione utenti</PageTitle>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Totale utenti', value: users.length, color: 'var(--text)' },
          { label: 'Admin', value: users.filter(u => u.role === 'admin').length, color: 'var(--accent2)' },
          { label: 'Studenti', value: users.filter(u => u.role === 'student').length, color: 'var(--accent)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['all', 'admin', 'student'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.35rem 0.9rem', borderRadius: 8, border: '1px solid var(--border)',
              background: filter === f ? 'var(--accent)' : 'var(--surface2)',
              color: filter === f ? 'white' : 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne'
            }}>
              {{ all: 'Tutti', admin: 'Admin', student: 'Studenti' }[f]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Cerca per nome..."
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.4rem 0.8rem', color: 'var(--text)', fontSize: '0.85rem',
            fontFamily: 'Syne', outline: 'none', minWidth: 200
          }}
        />
        {actionMsg && (
          <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--green)', fontWeight: 600 }}>
            {actionMsg}
          </span>
        )}
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <Empty message="Nessun utente trovato." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(u => (
            <Card key={u.id} style={{ padding: '0.9rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: u.role === 'admin' ? 'rgba(249,115,22,0.15)' : 'rgba(124,106,247,0.15)',
                  border: `1px solid ${u.role === 'admin' ? 'rgba(249,115,22,0.3)' : 'rgba(124,106,247,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem',
                  color: u.role === 'admin' ? 'var(--accent2)' : 'var(--accent)'
                }}>
                  {u.full_name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    {u.full_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Registrato: {new Date(u.created_at).toLocaleDateString('it')}
                  </div>
                </div>

                {/* Role badge */}
                <Badge variant={u.role === 'admin' ? 'pending' : 'open'}>
                  {u.role === 'admin' ? '👤 ADMIN' : '🎓 STUDENT'}
                </Badge>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {u.role === 'student' ? (
                    <Btn size="sm" variant="ghost" onClick={() => changeRole(u.id, 'admin')}
                      style={{ color: 'var(--accent2)', borderColor: 'rgba(249,115,22,0.3)' }}>
                      ↑ Promuovi admin
                    </Btn>
                  ) : (
                    <Btn size="sm" variant="ghost" onClick={() => changeRole(u.id, 'student')}
                      style={{ color: 'var(--accent)', borderColor: 'rgba(124,106,247,0.3)' }}>
                      ↓ Retrocedi student
                    </Btn>
                  )}
                  <Btn size="sm" variant="danger" onClick={() => deleteUser(u.id, u.full_name)}>
                    🗑
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Note eliminazione */}
      <div style={{
        marginTop: '1.5rem', padding: '0.9rem 1rem', borderRadius: 10,
        background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
        fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6
      }}>
        ⚠️ <strong style={{ color: '#eab308' }}>Nota sull'eliminazione:</strong> per eliminare un account completo vai su{' '}
        <strong>Supabase → Authentication → Users</strong> e cancellalo da lì.
        La modifica del ruolo invece funziona direttamente da questa pagina.
      </div>
    </div>
  )
}
