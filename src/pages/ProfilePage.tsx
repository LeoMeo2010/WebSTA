import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { PageTitle, Card, Input, Btn } from '@/components/shared/ui'

export default function ProfilePage() {
  const { profile, user } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  async function saveName() {
    if (!fullName.trim()) return
    setNameSaving(true)
    setNameMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user!.id)
    setNameSaving(false)
    setNameMsg(error ? '❌ Errore nel salvataggio.' : '✅ Nome aggiornato!')
    setTimeout(() => setNameMsg(''), 3000)
  }

  async function savePassword() {
    setPwdError('')
    setPwdMsg('')
    if (newPassword.length < 6) { setPwdError('La password deve essere di almeno 6 caratteri.'); return }
    if (newPassword !== confirmPassword) { setPwdError('Le password non coincidono.'); return }
    setPwdSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwdSaving(false)
    if (error) {
      setPwdError('❌ ' + error.message)
    } else {
      setPwdMsg('✅ Password aggiornata!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwdMsg(''), 3000)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageTitle>Il mio account</PageTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Info base */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-dim)' }}>
            👤 Informazioni personali
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nome e cognome"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Il tuo nome"
            />
            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Btn onClick={saveName} disabled={nameSaving}>
                {nameSaving ? 'Salvataggio...' : '💾 Salva nome'}
              </Btn>
              {nameMsg && <span style={{ fontSize: '0.82rem', color: 'var(--green)' }}>{nameMsg}</span>}
            </div>
          </div>
        </Card>

        {/* Ruolo */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-dim)' }}>
            🏷 Ruolo
          </h2>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 10,
            background: profile?.role === 'admin' ? 'rgba(249,115,22,0.1)' : 'rgba(124,106,247,0.1)',
            border: `1px solid ${profile?.role === 'admin' ? 'rgba(249,115,22,0.3)' : 'rgba(124,106,247,0.3)'}`,
            color: profile?.role === 'admin' ? 'var(--accent2)' : 'var(--accent)',
            fontWeight: 700, fontSize: '0.88rem'
          }}>
            {profile?.role === 'admin' ? '👤 Amministratore' : '🎓 Studente'}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Il ruolo può essere modificato solo da un amministratore.
          </p>
        </Card>

        {/* Cambio password */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-dim)' }}>
            🔒 Cambia password
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nuova password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="min. 6 caratteri"
            />
            <Input
              label="Conferma nuova password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="ripeti la password"
            />
            {pwdError && <p style={{ color: 'var(--red)', fontSize: '0.82rem', margin: 0 }}>{pwdError}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Btn onClick={savePassword} disabled={pwdSaving}>
                {pwdSaving ? 'Aggiornamento...' : '🔑 Aggiorna password'}
              </Btn>
              {pwdMsg && <span style={{ fontSize: '0.82rem', color: 'var(--green)' }}>{pwdMsg}</span>}
            </div>
          </div>
        </Card>

        {/* Info account */}
        <Card style={{ padding: '1.25rem', opacity: 0.7 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            📅 Account creato il: <strong style={{ color: 'var(--text-dim)' }}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('it') : '—'}
            </strong>
          </div>
        </Card>

      </div>
    </div>
  )
}
