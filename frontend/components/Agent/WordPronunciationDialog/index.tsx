import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchWordPronunciations,
  addWordPronunciation,
  updateWordPronunciation,
  deleteWordPronunciation,
} from "@/lib/apis";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export function WordPronunciationDialog({ open, onOpenChange, agentId }) {
  const [list, setList] = useState([]);
  const [word, setWord] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    if (!word || !pronunciation) {
      toast.error("Please enter both word and pronunciation.");
      return;
    }
    try {
      if (editingId) {
        await updateWordPronunciation(editingId, word, pronunciation, agentId);
        toast.success("Word pronunciation updated.");
      } else {
        await addWordPronunciation(word, pronunciation, agentId);
        toast.success("Word pronunciation added.");
      }
      setWord("");
      setPronunciation("");
      setEditingId(null);
      fetchList();
    } catch (e) {
      toast.error("Failed to save word pronunciation.");
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
      toast.success("Word pronunciation deleted.");
      fetchList();
    } catch (e) {
      toast.error("Failed to delete word pronunciation.");
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  }

  function handleClose() {
    setWord("");
    setPronunciation("");
    setEditingId(null);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Words & Pronunciation List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
              <Input
                placeholder="Pronunciation"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
              />
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-600/80 text-white hover:text-white"
              >
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
            <table className="w-full text-sm border border-border rounded-md overflow-hidden">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-2">Word</th>
                  <th className="text-left px-4 py-2">Pronunciation</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-border hover:bg-accent transition-colors"
                  >
                    <td className="px-4 py-2">{item.word}</td>
                    <td className="px-4 py-2">{item.pronunciation}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Pencil
                          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => handleEdit(item)}
                          aria-label="Edit"
                          role="button"
                          tabIndex={0}
                          color="#1f89de"
                        />
                        <Trash2
                          className="h-4 w-4 cursor-pointer text-destructive transition-colors"
                          onClick={() => { setShowDeleteDialog(true); setDeleteTarget(item); }}
                          aria-label="Delete"
                          role="button"
                          tabIndex={0}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the word & pronunciation pair
            <span className="font-semibold"> {deleteTarget?.word} - {deleteTarget?.pronunciation} </span>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteTarget(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteTarget.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
