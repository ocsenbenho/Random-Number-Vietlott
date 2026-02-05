const API_BASE_URL = 'http://localhost:3000';

export async function fetchGames() {
    try {
        const response = await fetch(`${API_BASE_URL}/games`);
        if (!response.ok) throw new Error('Failed to fetch games');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function generateNumbers(gameId, isSmart = false, strategy = 'random') {
    try {
        let url = `${API_BASE_URL}/generate?game=${gameId}`;
        if (isSmart) {
            url += `&smart=true`;
        }
        if (strategy) {
            url += `&strategy=${strategy}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to generate numbers');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function saveNumbers(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save numbers');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function fetchSavedNumbers(gameId) {
    try {
        let url = `${API_BASE_URL}/saved?limit=10`;
        if (gameId) {
            url += `&game=${gameId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch saved numbers');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function checkHistory(gameId, numbers) {
    try {
        const response = await fetch(`${API_BASE_URL}/check-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ game: gameId, numbers })
        });
        if (!response.ok) throw new Error('Failed to check history');
        return await response.json();
    } catch (error) {
        console.error(error);
        return { match: null };
    }
}

export async function fetchHistory(gameId) {
    try {
        let url = `${API_BASE_URL}/history`;
        if (gameId) {
            url += `?game=${gameId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (error) {
        console.error("Fetch history error:", error);
        return [];
    }
}
export async function triggerCrawl() {
    try {
        const response = await fetch(`${API_BASE_URL}/crawl`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Crawl failed');
        return await response.json();
    } catch (error) {
        console.error("Trigger crawl error:", error);
        throw error;
    }
}

export async function deleteNumbers(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/saved/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete');
        return await response.json();
    } catch (error) {
        console.error("Delete error:", error);
        throw error;
    }
}
