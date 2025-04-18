from app.services.mysql import mysql_service
from app.model.word_pronunciation import WordPronunciation

class WordPronunciationService:
    async def get_word_pronunciations(self, agent_id=None):
        """Return a list of WordPronunciation, optionally filtered by agent_id."""
        rows = await mysql_service.get_word_pronunciations(agent_id)
        return [WordPronunciation(**row) for row in rows]

    async def create_word_pronunciation(self, item):
        """Create a new WordPronunciation entry."""
        item_id = await mysql_service.insert_word_pronunciation(item.agent_id, item.word, item.pronunciation)
        # Fetch the created item for return
        rows = await mysql_service.get_word_pronunciations(item.agent_id)
        for row in rows:
            if row['id'] == item_id:
                return WordPronunciation(**row)
        return None

    async def update_word_pronunciation(self, item_id, item):
        """Update an existing WordPronunciation entry."""
        updated = await mysql_service.update_word_pronunciation(item_id, item.word, item.pronunciation)
        if updated:
            # Fetch the updated item for return
            rows = await mysql_service.get_word_pronunciations(item.agent_id)
            for row in rows:
                if row['id'] == item_id:
                    return WordPronunciation(**row)
        return None

    async def delete_word_pronunciation(self, item_id):
        """Delete a WordPronunciation entry by id."""
        return await mysql_service.delete_word_pronunciation(item_id)

word_pronunciation_service = WordPronunciationService()