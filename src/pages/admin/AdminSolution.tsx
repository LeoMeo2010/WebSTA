import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { supabase } from '@/lib/supabase'
import { PageTitle, Card, Btn, Spinner } from '@/components/shared/ui'

export default function AdminSolution() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [exercise, setExercise] = useState<any>(null)
  const [mainCode, setMainCode] = useState('')
  const [testCode, setTestCode] = useState('')
  const [activeTab, setActiveTab] = useState<'main' | 'test'>('main')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id, title, solution_main_code, solution_test_code, solution_published')
      .eq('id', id!)
      .single()
      .then(({ data }) => {
        if (!data) return
        setExercise(data)
        setMainCode(data.solution_main_code ?? '// Main\nfun main() {\n\n}\n')
        setTestCode(data.solution_test_code ?? '// Test\n')
        setPublished(data.solution_published ?? false)
        setLoading(false)
      })
  }, [id])

  async function handleSave(publish?: boolean) {
    setSaving(true)
    setMsg('')
    const newPublished = publish !== undefined ? publish : published
    const { error } = await supabase
      .from('exercises')
      .update({
        solution_main_code: mainCode,
        solution_test_code: testCode,
        solution_published: newPublished,
      })
      .eq('id', id!)
    setSaving(false)
    if (error) {
      setMsg('❌ Errore: ' + error.message)
    } else {
      setPublished(newPublished)
      setMsg(newPublished ? '✅ Soluzione salvata e pubblicata!' : '✅ Soluzione salvata come bozza.')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  if (loading) return <Spinner />
  if (!exercise) return <div style={{ color: 'var(--red)', padding: '2rem' }}>Esercizio non trovato.</div>

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono',
    fontSize: '0.82rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  return (
    <div>
      <button onClick={() => navigate('/admin/exercises')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        ← Torna agli esercizi
      </button>
      <PageTitle>Soluzione — {exercise.title}</PageTitle>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
          background: published ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.1)',
          color: published ? 'var(--green)' : '#eab308',
          border: `1px solid ${published ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`
        }}>
          {published ? '🌐 Pubblicata — visibile agli studenti' : '🔒 Bozza — non visibile agli studenti'}
        </div>
        {msg && <span style={{ fontSize: '0.82rem', color: 'var(--green)' }}>{msg}</span>}
      </div>

      <Card style={{ overflow: 'hidden', marginBottom: '1rem' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle(activeTab === 'main')} onClick={() => setActiveTab('main')}>
            📄 Main.kt
          </button>
          <button style={tabStyle(activeTab === 'test')} onClick={() => setActiveTab('test')}>
            🧪 Test.kt
          </button>
        </div>

        {/* Main editor */}
        <div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
          <Editor
            height="500px"
            language="kotlin"
            theme="vs-dark"
            value={mainCode}
            onChange={v => setMainCode(v ?? '')}
            options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on' }}
          />
        </div>

        {/* Test editor */}
        <div style={{ display: activeTab === 'test' ? 'block' : 'none' }}>
          <Editor
            height="500px"
            language="kotlin"
            theme="vs-dark"
            value={testCode}
            onChange={v => setTestCode(v ?? '')}
            options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on' }}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Btn onClick={() => handleSave(false)} disabled={saving} variant="ghost">
          💾 Salva come bozza
        </Btn>
        <Btn onClick={() => handleSave(true)} disabled={saving}>
          {published ? '🔄 Aggiorna e mantieni pubblica' : '🌐 Salva e pubblica'}
        </Btn>
        {published && (
          <Btn onClick={() => handleSave(false)} disabled={saving} variant="danger">
            🔒 Nascondi agli studenti
          </Btn>
        )}
      </div>
    </div>
  )
}