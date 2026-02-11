import axios from "axios";

export const axiosBrowser = axios.create({
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});
