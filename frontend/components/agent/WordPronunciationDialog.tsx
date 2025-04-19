import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchWordPronunciations, addWordPronunciation, updateWordPronunciation, deleteWordPronunciation } from "@/lib/apis";

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
    try {
      const data = await fetchWordPronunciations(agentId);
      setList(data);
    } catch (e) {
      // Optionally handle error
    }
  }

  async function handleSave() {
    if (!word || !pronunciation) return;
    try {
      if (editingId) {
        await updateWordPronunciation(editingId, word, pronunciation, agentId);
      } else {
        await addWordPronunciation(word, pronunciation, agentId);
      }
      setWord("");
      setPronunciation("");
      setEditingId(null);
      fetchList();
    } catch (e) {
      // Optionally handle error
    }
  }

  async function handleEdit(item) {
    setWord(item.word);
    setPronunciation(item.pronunciation);
    setEditingId(item.id);
  }

  async function handleDelete(id) {
    try {
      await deleteWordPronunciation(id);
      fetchList();
    } catch (e) {
      // Optionally handle error
    }
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