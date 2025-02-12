# Secure File Dashboard

This project is a demo of a secure file dashboard that enables users to upload, preview, and download files securely. The file upload process is highly performant and network friendly, as it allows users to upload files in chunks rather than in a single attempt. Each chunk is retryable, meaning that if a network error disrupts the upload process, users can resume uploading without having to restart the entire file transfer.

## Disclaimer

1. **Authentication:**  
   To limit the scope of the project, the authentication mechanism is simplified. The combination of username and password generates a SHA-256 token that serves as the user's identifier.
2. **Project URL:**  
   The project is accessible via: [https://18-179-7-185.nip.io/](https://18-179-7-185.nip.io/)
3. **Execution Instructions:**  
   Details on how to run the application are provided at the end of this document.

## Tech Stack

- **NGINX:** Used as a load balancer.
- **React Router:** Serves as both the frontend routing solution and the backend actions handler.
- **Shadcn UI & Tailwind CSS:** Utilized for creating a modern and responsive user interface.

## Client Application Security

- **Content Security Policy (CSP):**  
  The application uses both CSP headers and meta tags to ensure that only trusted sources can provide media or execute scripts.
- **Security-Focused HTTPS Headers:**  
  Headers such as `X-Content-Type-Options: nosniff` are used to prevent MIME type sniffing. `Strict-Transport-Security (HSTS)` to enforce secure connection between browser and server. `X-Content-Type-Options` to prevent browser fron MIME Sniffing and respect the `Content-Type` header from server. `X-Frame-Options` as an additional safeguad against clickjacking by preventing the page from being embedded in frames from other origin.
- **Client-Side File Validation:**  
  The browser's File API is employed to check the file's MIME type before the upload, ensuring that only valid files are processed.

## Server-Side Security Recommendations

- **Chunk-Based File Upload:**  
  Files are uploaded in smaller, manageable chunks, which improves reliability and resilience against network issues.
- **Server-Side MIME Revalidation:**  
  The server revalidates the file’s MIME type by inspecting its buffer signature to ensure data integrity.
- **DDoS Protection:**  
  Endpoints are safeguarded from DDoS attacks through IP-based rate limiting implemented using NGINX.
- **Virus Scanning:**  
  Uploaded files are scanned for viruses using [`clamav`](https://www.clamav.net/).

## Performance Plan

- **Efficient Large File Uploads:**  
  Large files are split into 1MB chunks to facilitate parallel uploading, significantly reducing upload times.
- **Resource Management:**  
  Temporary files generated during the upload process are promptly cleaned up once the upload is completed or cancelled, freeing up memory and storage resources.

## Additional Features

- **Cancellable Uploads:**  
  Users have the ability to cancel an ongoing file upload at any time.

## How to Run the Application Locally

1. **Clone the Repository:**  
   Clone the project repository to your local environment.
2. **Start the Services:**  
   Execute the following command:
   ```bash
   docker-compose up -d
   ```
3. **Restarting the Application:**
   If the application shuts down, restart the `app` service using Docker Compose after ensuring that the antivirus and NGINX services are running.

4. **Accessing the Application:**
   The application is accessible via `localhost`.

## Web Performance
1. **Local Metrics**

![Screenshot 2025-02-11 at 13 16 03](https://github.com/user-attachments/assets/90ffe897-d973-4d2d-a66b-9bac289c3b9e)

2. **Lighthouse**

![Screenshot 2025-02-11 at 13 17 04](https://github.com/user-attachments/assets/77c5d48c-403e-4678-b8ef-ce6773265ebf)

3. **HTTP Observatory Report**

![Screenshot 2025-02-11 at 13 17 27](https://github.com/user-attachments/assets/6839d15e-6d60-49bc-a2b7-94e4c23b6e3b)
