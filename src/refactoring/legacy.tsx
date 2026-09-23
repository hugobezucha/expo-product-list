import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// This component is meant to fetch user data and display it.
// It receives a userId and a function to call when the user is fetched.
const UserProfile = (props) => {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(false);

  const fetchUser = () => {
    setLoading(true);
    fetch(`https://dummyjson.com/users/${props.userId}`)
      .then(res => res.json())
      .then(json => {
        setUser(json);
        if (props.onUserFetched) {
          props.onUserFetched(json);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []); // Should this re-fetch when userId changes?

  return (
    <View style={{ padding: 20 }}>
      {loading ? (
        <Text>Loading user...</Text>
      ) : (
        <View>
          <Text style={{ fontWeight: 'bold' }}>User Details:</Text>
          <Text>Name: {user ? user.firstName + ' ' + user.lastName : 'N/A'}</Text>
          <Text>Email: {user ? user.email : 'N/A'}</Text>
        </View>
      )}
      <TouchableOpacity onPress={fetchUser} style={{ marginTop: 10, backgroundColor: 'blue', padding: 10 }}>
        <Text style={{ color: 'white' }}>Refresh User</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserProfile;
