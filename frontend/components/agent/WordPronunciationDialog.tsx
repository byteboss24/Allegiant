import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function WordPronunciationDialog({ open, onOpenChange, agentId }) {
  const [list, setList] = useState([]);
  const [word, setWord] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (open) fetchList();
  }, [open, agentId]);

  async function fetchList() {
    const res = await fetch(`${API_BASE_URL}/api/v1/word-pronunciations?agent_id=${agentId || ''}`);
    const data = await res.json();
    setList(data);
  }

  async function handleSave() {
    if (!word || !pronunciation) return;
    if (editingId) {
      await fetch(`${API_BASE_URL}/api/v1/word-pronunciations/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, pronunciation, agent_id: agentId }),
      });
    } else {
      await fetch(`${API_BASE_URL}/api/v1/word-pronunciations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, pronunciation, agent_id: agentId }),
      });
    }
    setWord("");
    setPronunciation("");
    setEditingId(null);
    fetchList();
  }

  async function handleEdit(item) {
    setWord(item.word);
    setPronunciation(item.pronunciation);
    setEditingId(item.id);
  }

  async function handleDelete(id) {
    await fetch(`${API_BASE_URL}/api/v1/word-pronunciations/${id}`, { method: "DELETE" });
    fetchList();
  }

  function handleClose() {
    setWord("");
    setPronunciation("");
    setEditingId(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Word & Pronunciation List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Word" value={word} onChange={e => setWord(e.target.value)} />
            <Input placeholder="Pronunciation" value={pronunciation} onChange={e => setPronunciation(e.target.value)} />
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Word</th>
                <th className="text-left">Pronunciation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.word}</td>
                  <td>{item.pronunciation}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} className="ml-2">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 