import { getSnapshot, loadSnapshot, type Editor } from 'tldraw'

const STORAGE_KEY = 'infinite-board-snapshot-v1'

export function saveToLocalStorage(editor: Editor): void {
  try {
    const snapshot = getSnapshot(editor.store)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Quota exceeded or other storage error — silently skip
  }
}

export function loadFromLocalStorage(editor: Editor): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const snapshot = JSON.parse(raw)
    loadSnapshot(editor.store, snapshot)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function exportBoardAsFile(editor: Editor): void {
  const snapshot = getSnapshot(editor.store)
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `board-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBoardFromFile(editor: Editor): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const snapshot = JSON.parse(text)
      loadSnapshot(editor.store, snapshot)
    } catch {
      alert('Invalid board file — could not load.')
    }
  }
  input.click()
}
