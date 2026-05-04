// Demonstrates: async fn, await, try! and catch

async fn fetchScore(userId: num): num {
  let score = await Promise.resolve(42)
  give score
}

async fn fetchName(userId: num): str {
  let name = await Promise.resolve("Alice")
  give name
}

async fn loadProfile(userId: num): any {
  guard userId > 0 else {
    fail "User ID must be positive"
  }
  try! {
    let score = await fetchScore(userId)
    let name = await fetchName(userId)
    give { id: userId, name: name, score: score }
  } catch err {
    fail `Profile load failed: {err}`
  }
}

async fn run(): void {
  let profile = await loadProfile(7)
  console.log(`Loaded profile for ID 7`)
  console.log(`Score: {profile.score}`)
}

run()
