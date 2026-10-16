export async function send(client, payload) {
  try { return await client.send(payload) }
  catch (error) { if (error.name === 'TimeoutError') return {ok:false}; throw error }
}
