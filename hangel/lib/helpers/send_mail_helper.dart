import 'package:mailer/mailer.dart' show Address, MailerException, Message, send;
import 'package:mailer/smtp_server/gmail.dart';

import '../models/general_response_model.dart';

class SendMailHelper {
  static Future<GeneralResponseModel> sendMail(
      {required List<String> to,
      required String subject,
      required String body,
      required String html}) async {
    String username = 'mykynk2@gmail.com';
    String password = 'qzbnoaqavpmbmhei';

    final smtpServer = gmail(username, password);
    // Use the SmtpServer class to configure an SMTP server:
    // final smtpServer = SmtpServer('smtp.domain.com');
    // See the named arguments of SmtpServer for further configuration
    // options.

    // Create our message.
    final message = Message()
      ..from = Address(username, 'Hangel')
      ..recipients.addAll(to)
      ..subject = subject
      ..text = body
      ..html = html;

    try {
      final sendReport = await send(message, smtpServer);
      print('Message sent: ' + sendReport.toString());
      return GeneralResponseModel(
          message: "Mail başarıyla gönderildi", success: true);
    } on MailerException catch (e) {
      print('Message not sent.' + e.toString());
      for (var p in e.problems) {
        print('Problem: ${p.code}: ${p.msg}');
      }
      return GeneralResponseModel(
          message: "Mail gönderilirken bir hata oluştu", success: false);
    }
  }
}
