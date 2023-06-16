import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const SESC = new SESClient({ region: "ap-southeast-2" });

export async function sendMail({TO, FROM, REPLY_TO, BODY, SUB}:{TO: string[], REPLY_TO:string, FROM: string, SUB: string, BODY: string}) {
  const input = { // SendEmailRequest
    Source: FROM, // required
    Destination: { // Destination
      ToAddresses: TO
    },
    Message: { // Message
      Subject: { // Content
        Data: SUB, // required
        Charset: "utf-8",
      },
      Body: { // Body
        Html: {
          Data: BODY, // required
          Charset: "utf-8",
        },
      },
    },
    ReplyToAddresses: [
      REPLY_TO,
    ],
  };
  
  const command = new SendEmailCommand(input);
  return await SESC.send(command);
}