
import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { getTemplate } from './lib/template';
import { sendMail } from './lib/send-mail';

interface FieldLabels {
  label: string,
  fields: {
    [key: string]: string
  }
}

interface EmailTemplateData {
  label: string,
  fields: Array<{
    label: string;
    value: string;
  }>
}

export const handler = async (
  event: APIGatewayProxyEventV2,
  _context: APIGatewayEventRequestContext
): Promise<APIGatewayProxyResultV2> => {

  const { 
    ALLOWED_ORIGINS, 
    NODE_ENV, 
    BRAND_NAME, 
    LOGO_URL, 
    RETURN_URL, 
    FORM_TITLE, 
    DELIVERY_EMAILS,
    FROM_EMAIL,
    REPLY_TO_EMAIL
  } = process.env;

  let responseString = 'OK';

  if(!ALLOWED_ORIGINS?.includes(event.headers['origin'] || 'not-defined')) {
    return {
      statusCode: 403,
      body: NODE_ENV === 'development' ? 'Invalid Origin passed: ' + JSON.stringify(event.headers['origin']) : 'Forbidden'
    }
  }
  
  console.log("event.body");
  console.log(event.body);
  // Prepare data
  const data = JSON.parse(event.body || '');
  const fieldLabels = JSON.parse(decodeURI(data.fieldLabels)) as FieldLabels[];

  // Process data
  const sections: EmailTemplateData[] = []
  responseString = '';
  fieldLabels.forEach(section => {
    const sec:EmailTemplateData =  {
      label: section.label,
      fields: []
    }
    responseString += `\n${decodeURI(section.label)}`;

    Object.keys(section.fields).forEach((label) => {
      sec.fields.push({
        label: decodeURI(label),
        value: decodeURI(data[section.fields[label]])
      })
      responseString += `\n\t${decodeURI(label)}: ${decodeURI(data[section.fields[label]])}`;
    })
    responseString += `\n`;
    sections.push(sec)
  })
  
  const template = getTemplate('./api/templates/success.hbs')
  const emailBodyTemplate = getTemplate('./api/templates/email.hbs')

  if (DELIVERY_EMAILS && FROM_EMAIL) {
    const subjectLine =  `${data['config.form-title'] || FORM_TITLE || 'form'} submission ${data['config.subject-part']} `;
    await sendMail({
      TO: DELIVERY_EMAILS.split(',').map(v => v.trim()),
      FROM: FROM_EMAIL,
      REPLY_TO: REPLY_TO_EMAIL || FROM_EMAIL,
      SUB: subjectLine,
      BODY: emailBodyTemplate({
        title: data['config.form-title'] || FORM_TITLE || 'form',
        sections
      })
    })
  }
  
  return {
    statusCode: 200,
    body: template({
      brandName: data['config.brand-name'] || BRAND_NAME || '--Your brand Name--',
      logoURL: data['config.logo-url'] || LOGO_URL,
      formTitle: data['config.form-title'] || FORM_TITLE || 'form',
      returnURL: data['config.return-url'] || RETURN_URL,
      debugMessage: NODE_ENV === 'development' ? responseString : undefined,
      emailMessage: NODE_ENV === 'development' ? emailBodyTemplate({
        title: data['config.form-title'] || FORM_TITLE || 'form',
        sections
      }) : undefined
    })
  }
};
