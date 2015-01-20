﻿using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net;
using System.Reactive.Linq;
using System.Text;

namespace LidokDetector.Service.Polling
{
    internal class PollService : IDisposable
    {
        private static string requestAccount;
        private static string requestPassword;


        private static readonly ConcurrentDictionary<int, PersonData> recentLocations =
            new ConcurrentDictionary<int, PersonData>();

        public static string AllUsers { get; private set; }

        private const int PollIntervalSeconds = 2;
        private const int CleanupIntervalMinutes = 2;

        private const int ExpiryIntervalMinutes = 10;

        private const int UsersListUpdateIntervalHours = 24;

        private IDisposable pollServiceSubscription;

        private IDisposable cleanupSubscription;

        private IDisposable allUsersUpdateSubscription;

        public static string GetPersonData(string location, int id)
        {
            string result;

            if (recentLocations.ContainsKey(id))
            {
                result = GetJsonValue(id);
            }
            else
            {
                recentLocations.AddOrUpdate(id,
                    _ =>
                    {
                        var data = new PersonData
                        {
                            LastRequest = DateTime.Now,
                            JsonData = String.Empty,
                            Office = location
                        };
                        UpdatePresence(id, data);
                        return data;
                    },
                    (key, oldValue) =>
                    {
                        oldValue.LastRequest = DateTime.Now;
                        return oldValue;
                    });

                result = GetJsonValue(id);
            }

            return result;
        }

        private static string GetJsonValue(int id)
        {
            string result;
            PersonData data;
            if (recentLocations.TryGetValue(id, out data))
            {
                data.LastRequest = DateTime.Now;
                result = data.JsonData;
            }
            else
            {
                result = String.Empty;
            }
            return result;
        }

        public void StartPolling(string account, string password)
        {
            requestAccount = account;
            requestPassword = password;

            pollServiceSubscription = Observable.Interval(TimeSpan.FromSeconds(PollIntervalSeconds)).Subscribe(x =>
            {
                foreach (var keyValue in recentLocations)
                {
                    UpdatePresence(keyValue.Key, keyValue.Value);
                }
            });

            cleanupSubscription = Observable.Interval(TimeSpan.FromMinutes(CleanupIntervalMinutes)).Subscribe(x =>
            {
                foreach (var keyValue in recentLocations)
                {
                    if (DateTime.Now.Subtract(keyValue.Value.LastRequest) > TimeSpan.FromMinutes(ExpiryIntervalMinutes))
                    {
                        PersonData dummy;
                        recentLocations.TryRemove(keyValue.Key, out dummy);
                    }
                }
            });

            allUsersUpdateSubscription = Observable.Return(0L)
                .Concat(Observable.Interval(TimeSpan.FromHours(UsersListUpdateIntervalHours)))
                .Subscribe(
                    x =>
                    {
                        try
                        {
                            var request =
                                WebRequest.Create("https://portal-ua.globallogic.com/officetime/json/employees.php");
                            SetBasicAuthHeader(request);

                            using (var sr = new StreamReader(request.GetResponse().GetResponseStream()))
                            {
                                AllUsers = sr.ReadToEnd();
                            }
                        }
                        catch (Exception)
                        {
                            AllUsers = AllUsers;
                        }
                    });
        }

        private static void UpdatePresence(int key, PersonData value)
        {
            var request = WebRequest.Create(
                "https://portal-ua.globallogic.com/officetime/json/last_seen.php?zone=" + value.Office.ToUpper() +
                "&employeeId=" + key);

            SetBasicAuthHeader(request);

            var response = request.GetResponse();

            using (var sr = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
            {
                value.JsonData = sr.ReadToEnd();
            }
        }

        private static void SetBasicAuthHeader(WebRequest request)
        {
            string authInfo = requestAccount + ":" + requestPassword;
            authInfo = Convert.ToBase64String(Encoding.Default.GetBytes(authInfo));
            request.Headers["Authorization"] = "Basic " + authInfo;
        }

        public void Dispose()
        {
            pollServiceSubscription.Dispose();
            cleanupSubscription.Dispose();
            allUsersUpdateSubscription.Dispose();
        }
    }
}
