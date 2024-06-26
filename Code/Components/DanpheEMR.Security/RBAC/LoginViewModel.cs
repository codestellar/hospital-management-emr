﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Security
{
    public class LoginViewModel
    {
        [Required]
        public string UserName { get; set; }

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Range(typeof(bool), "false", "true")]
        [Display(Name = "Remember me?")]        
        public bool RememberMe { get; set; }
    }

    //We are using this DTO just to take login credentials from Swagger and Postman not from actual application, Krishna, 13thJan'23
    public class LoginDto
    {
        [Required]
        public string UserName { get; set; }

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }
    }

}
