# Prompts for Task 2:

- Create a modern, responsive Login page where username and password are required
- Create a sign up page 
- Let GameScreen match the styling of the auth pages
- create a useAuthStore.tsx zustand store. It should have login, logout & signup functions along with the necessary states.
- Can you use axios for the api calls and extract them into a separate apis.ts file?
- I'll be using Flask and not Next.js to expose the needed endpoints
- When signing up or logging in, I want to store the user type of the user as well. Let the default be 'player', and when logging in or signing up, I want to retrieve it so that I can route the user appropriately
- Add an error and setError in the LoginPage to show the response.message that comes back from the login request
- Can you add the same in the SignupPage?
- Add a logout button icon to logout. Let me know only what to add Also I want to show the user's username
- Adjust the layout, and let the restart button be an icon too
- I want to create a similar component to GridBoard.tsx, but I want it to be called LevelBuilder. It would allow an admin to build a level. The admin would first choose the rows & cols of the grid. After this is generated (all sand tiles), the admin would place stones, boxes, and finish points. The finish points have to be equal to the number of boxes. Also, the admin should specifiy a starting point for the Player. Nothing can be placed where the player's starting point is. There should also be a delete tool which would remove anything placed there (unless it is already an empty sand tile). Let the UI match the previous login and signup pages.
- I want to also add a name for the level as well as a score which will be numeric
- On server load, can you create an admin user with a username of admin & a password of admin?
- Using this: 

```ts
type LevelData = { rows: number; cols: number; cell: number; stones: { row: number; col: number }[]; boxes: { row: number; col: number }[]; finishPoints: { row: number; col: number }[]; initial: { row: number; col: number } | null; name: string; // <-- add score: number; // <-- add }; 
```
 I want to create in my app.py entries for the levels. I also want to be able to fetch the current levels using a get request and add levels using a post request. However, to be able to add a level, everything has to be provided, all points have to be validated that they are not overlapping or out of bounds, and the user has to have a user_type of admin
- generate a useGameStore.tsx zustand store which would call these endpoints from apis.ts Also add these endpoint calls using axios in api.ts first
- Can you use these new endpoints here and show any error message? If there is no error message, show a success message :

```ts
import LevelBuilder from '@/components/LevelBuilder' import { useAuthStore } from '@/store/useAuthStore'; import { useEffect } from 'react'; import { useNavigate } from 'react-router-dom'; const CreateLevelPage = () => { const navigate = useNavigate(); const { user } = useAuthStore(); useEffect(() => { if (!user || user.user_type !== "admin") { navigate("/signin"); } }, [user, navigate]); return ( <LevelBuilder onSave={(data) => console.log(data)} /> ) } export default CreateLevelPage;
```

- Create a View Levels screen that would show the available levels as LevelCards components (Create the LevelCard component as well) It should show the name & score
- Add sql db to keep data persistent in app.py
- Add an endpoint to get a specific level by id 
- Let GameScreen take a level id as a param, and then it would call this `fetchLevel: (levelId: string) => Promise<Level>;`
- I want to store a score for each user (start with 0) and I want an endpoint that would contain the id for the level that the user completed so that the level's score would be added. I want an endpoint to get all users as well.
- Create a Landing Page that would contain Leaderboard by getting all users and displaying username and score Let there be a button called Play now or something like that that would navigate to /game/view-levels