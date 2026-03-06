import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageTitle, Card, Spinner } from '@/components/shared/ui'

export default function StudentSolution() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<any>(null)
  const [hasSubmission, setHasSubmission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'main' | 'test'>('main')

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: ex }, { data: sub }] = await Promise.all([
        supabase.from('exercises').select('id, title, solution_main_code, solution_test_code, solution_published').eq('id', id!).single(),
        supabase.from('submissions').select('id').eq('exercise_id', id!).eq('student_id', user!.id).maybeSingle(),
      ])
      setExercise(ex)
      setHasSubmission(!!sub)
      setLoading(false)
    }
    load()
  }, [id, user])

  if (loading) return <Spinner />

  if (!exercise?.solution_published) {
    return (
      <div style={{ maxWidth: 560, margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Soluzione non disponibile</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Il docente non ha ancora pubblicato la soluzione per questo esercizio.
        </p>
        <button onClick={() => navigate('/student')} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.88rem' }}>
          ← Torna agli esercizi
        </button>
      </div>
    )
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
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
      <button onClick={() => navigate('/student')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        ← Torna agli esercizi
      </button>
      <PageTitle>Soluzione — {exercise.title}</PageTitle>

      {!hasSubmission && (
        <div style={{
          marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 10,
          background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.25)',
          fontSize: '0.82rem', color: '#eab308'
        }}>
          ⚠️ Non hai ancora consegnato questo esercizio. Ti consigliamo di provare prima da solo!
        </div>
      )}

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle(activeTab === 'main')} onClick={() => setActiveTab('main')}>
            📄 Main.kt
          </button>
          <button style={tabStyle(activeTab === 'test')} onClick={() => setActiveTab('test')}>
            🧪 Test.kt
          </button>
        </div>

        <div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
          <Editor height="500px" language="kotlin" theme="vs-dark"
            value={exercise.solution_main_code ?? ''}
            options={{ readOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }} />
        </div>
        <div style={{ display: activeTab === 'test' ? 'block' : 'none' }}>
          <Editor height="500px" language="kotlin" theme="vs-dark"
            value={exercise.solution_test_code ?? ''}
            options={{ readOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }} />
        </div>
      </Card>
    </div>
  )
}
