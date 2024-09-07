import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/profile_page_provider.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:provider/provider.dart';

class UserNameForm extends StatefulWidget {
  const UserNameForm({Key? key}) : super(key: key);

  @override
  State<UserNameForm> createState() => _UserNameFormState();
}

class _UserNameFormState extends State<UserNameForm> {
  TextEditingController controller =
      TextEditingController(text: HiveHelpers.getUserFromHive().name ?? '');
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          FormFieldWidget(
            context,
            controller: controller,
            keyboardType: TextInputType.name,
            title: "İsim",
          ),
          SizedBox(
            height: deviceHeightSize(context, 20),
          ),
          GeneralButtonWidget(
            onPressed: () {
              if (controller.text.isEmpty) {
                ToastWidgets.errorToast(context, "Lütfen isminizi giriniz");
                return;
              }
              if (controller.text == HiveHelpers.getUserFromHive().name) {
                ToastWidgets.errorToast(
                    context, "Lütfen farklı bir isim giriniz");
                return;
              }
              UserModel user = HiveHelpers.getUserFromHive();
              user.name = controller.text;
              context.read<ProfilePageProvider>().updateProfile(
                {
                  "name": controller.text,
                },
                user,
              ).then((value) {
                if (value.success == true) {
                  Navigator.pop(context);
                }
                ToastWidgets.responseToast(context, value);
              });
            },
            text: "Kaydet",
            buttonColor: AppTheme.secondaryColor,
          ),
          SizedBox(
            height: deviceHeightSize(context, 40) +
                MediaQuery.of(context).viewInsets.bottom,
          ),
        ],
      ),
    );
  }
}
