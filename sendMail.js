'use strict'
const nodemailer = require('nodemailer')

const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'fingerprint.tcc.2018@gmail.com',
    pass: 'smartiotassuresegdedadossegnatelabelessa369.@'
  }
}

let to = ['danieltakasu@gmail.com', 'lucas.felgueiras@usp.br'].join(',')

const sendEmail = async ({
  body,
  subject = 'Resultado do Ifconfig',
  destination
}) => {
  let httpResult, smtpResult

  if (smtpConfig.host && to) {
    const smtpBody = {
      from: smtpConfig.auth.user,
      subject,
      html: body,
      to
    }

    const transport = nodemailer.createTransport(smtpConfig)

    smtpResult = await (new Promise((resolve, reject) => {
      transport.sendMail(smtpBody, (err, data) => {
        if (err) {
          return reject(err)
        } else {
          return resolve(data)
        }
      })
    }))
  }
  return { httpResult, smtpResult }
}

module.exports = sendEmail
