class WordPronunciationService:
    async def get_word_pronunciations(self, agent_id=None):
        """Return a list of WordPronunciation, optionally filtered by agent_id."""
        pass

    async def create_word_pronunciation(self, item):
        """Create a new WordPronunciation entry."""
        pass

    async def update_word_pronunciation(self, item_id, item):
        """Update an existing WordPronunciation entry."""
        pass

    async def delete_word_pronunciation(self, item_id):
        """Delete a WordPronunciation entry by id."""
        pass

word_pronunciation_service = WordPronunciationService() 