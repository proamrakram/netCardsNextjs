import axios from "axios";

export const axiosBrowser = axios.create({
    headers: {
        Accept: "application/json",
    },
});
