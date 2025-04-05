import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface ExtendedUser extends User {
    name?: string;
    location?: string;
  }

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (error) {
        alert(error);
        }
    }, [error]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if(currentUser){
            try{
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                      ...currentUser,
                      name: userData.name,
                      location: userData.location,
                    });
                } else {
                    setUser(currentUser); // fallback if no Firestore data
                  }
            } catch(error){
                console.error("Failed to fetch user data from Firestore:", error);
                setUser(currentUser);
                setError("Failed to load user data.");
            }            
        }
        else{
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (name: string, email: string, password: string, location: string) => {
    setError(null);
    if (!name || !email || !password || !location) {
        const msg = "All fields are required";
        setError(msg);
        throw new Error(msg);
    }      
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) throw new Error("Failed to create user.");
      
        // Store extra fields in Firestore
        await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        location,
        createdAt: new Date().toISOString(),
        });

        console.log("User signed up and data stored:", user.uid);
        return user;
    }
    catch (error) {
      console.error("Sign Up Error:", error);
      setError("An error occurred during sign up.");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    if (!email || !password) {
        const msg = "Email and password must not be empty.";
        setError(msg);
        throw new Error(msg);
    }
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in user:", userCredential.user);
      return userCredential.user;
    } 
    catch (error) {
        const err = error as { code?: string; message?: string };
        console.error("Sign In Error:", err.code, err.message);
        setError("Failed to sign in.");
        throw error;
    }
  };
  

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      setError("Failed to log out. Please try again.");
      throw error;
    }
  };

  return { user, signUp, signIn, logout, loading, error};
}
